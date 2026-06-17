from django.db import transaction
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from tasks.models import BankMovement, Collection, PaymentAllocation
from tasks.serializers import (
    BankMovementSerializer,
    BankMovementListResponseSerializer,
    BankMovementResponseSerializer,
    CollectionSerializer,
    CollectionListResponseSerializer,
    CollectionResponseSerializer,
    EmptySuccessResponseSerializer,
    ErrorResponseSerializer,
    ReconciliationSerializer,
    ReconciliationResponseSerializer,
)


def success_response(message: str, data: object, status_code: int) -> Response:
    # Unifica el formato JSON de las respuestas exitosas.
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def error_response(message: str, errors: object, status_code: int) -> Response:
    # Unifica el formato JSON de los errores controlados.
    return Response(
        {
            "success": False,
            "message": message,
            "errors": errors,
        },
        status=status_code,
    )


class CollectionListCreateView(generics.ListCreateAPIView):
    # Usa una vista generica porque listar y crear aqui es comportamiento estandar.
    queryset = Collection.objects.prefetch_related("payment_allocations__bank_movement").all()
    serializer_class = CollectionSerializer

    @extend_schema(
        summary="Listar cobros",
        description="Retorna todos los cobros con montos calculados y detalle de pagos asociados.",
        responses={
            200: CollectionListResponseSerializer,
        },
    )
    def list(self, request, *args, **kwargs):  # noqa: ARG002
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(
            "Collections obtenidas correctamente.",
            serializer.data,
            status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Crear cobro",
        description="Crea un cobro mensual en CLP o UF.",
        request=CollectionSerializer,
        responses={
            201: CollectionResponseSerializer,
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Datos invalidos."),
        },
        examples=[
            OpenApiExample(
                "Cobro mensual CLP",
                value={
                    "contract_id": 123,
                    "mes_cobro": "2026-04-01",
                    "monto_cobro": "250000.00",
                    "moneda": "CLP",
                },
                request_only=True,
            )
        ],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "No fue posible crear la collection.",
                serializer.errors,
                status.HTTP_400_BAD_REQUEST,
            )

        collection = serializer.save()
        response_serializer = self.get_serializer(collection)
        return success_response(
            "Collection creada correctamente.",
            response_serializer.data,
            status.HTTP_201_CREATED,
        )


class CollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    # El detalle reutiliza el mismo serializer enriquecido del listado.
    queryset = Collection.objects.prefetch_related("payment_allocations__bank_movement").all()
    serializer_class = CollectionSerializer

    @extend_schema(
        summary="Obtener cobro",
        description="Retorna el detalle de un cobro con sus pagos asociados.",
        responses={
            200: CollectionResponseSerializer,
            404: OpenApiResponse(response=ErrorResponseSerializer, description="Cobro no encontrado."),
        },
    )
    def retrieve(self, request, *args, **kwargs):  # noqa: ARG002
        collection = self.get_object()
        serializer = self.get_serializer(collection)
        return success_response(
            "Collection obtenida correctamente.",
            serializer.data,
            status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Editar cobro",
        description="Actualiza los datos de un cobro existente.",
        request=CollectionSerializer,
        responses={
            200: CollectionResponseSerializer,
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Datos invalidos."),
            404: OpenApiResponse(response=ErrorResponseSerializer, description="Cobro no encontrado."),
        },
    )
    def patch(self, request, *args, **kwargs):
        collection = self.get_object()
        if collection.payment_allocations.exists():
            return error_response(
                "No fue posible actualizar la collection.",
                {"detail": "No puedes editar un cobro que ya tiene pagos asociados."},
                status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(collection, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                "No fue posible actualizar la collection.",
                serializer.errors,
                status.HTTP_400_BAD_REQUEST,
            )

        updated_collection = serializer.save()
        response_serializer = self.get_serializer(updated_collection)
        return success_response(
            "Collection actualizada correctamente.",
            response_serializer.data,
            status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Eliminar cobro",
        description="Elimina un cobro solo si aun no tiene pagos asociados.",
        responses={
            200: EmptySuccessResponseSerializer,
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description="El cobro ya tiene pagos asociados.",
            ),
            404: OpenApiResponse(response=ErrorResponseSerializer, description="Cobro no encontrado."),
        },
    )
    def delete(self, request, *args, **kwargs):  # noqa: ARG002
        collection = self.get_object()

        # Evita borrar cobros que ya participan del historico de pagos.
        if collection.payment_allocations.exists():
            return error_response(
                "No fue posible eliminar la collection.",
                {"detail": "No puedes eliminar un cobro que ya tiene pagos asociados."},
                status.HTTP_400_BAD_REQUEST,
            )

        collection.delete()
        return success_response(
            "Collection eliminada correctamente.",
            {"detail": "El cobro fue eliminado."},
            status.HTTP_200_OK,
        )


class BankMovementListCreateView(generics.ListCreateAPIView):
    # Este endpoint expone movimientos con su saldo disponible ya calculado.
    queryset = BankMovement.objects.all()
    serializer_class = BankMovementSerializer

    @extend_schema(
        summary="Listar transferencias",
        description="Retorna todos los movimientos bancarios con saldo asignado y disponible.",
        responses={
            200: BankMovementListResponseSerializer,
        },
    )
    def list(self, request, *args, **kwargs):  # noqa: ARG002
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(
            "Bank movements obtenidos correctamente.",
            serializer.data,
            status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Crear transferencia",
        description="Crea un movimiento bancario recibido en CLP.",
        request=BankMovementSerializer,
        responses={
            201: BankMovementResponseSerializer,
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Datos invalidos."),
        },
        examples=[
            OpenApiExample(
                "Transferencia recibida",
                value={
                    "fecha": "2026-04-15",
                    "glosa": "Transferencia contrato 123",
                    "monto": "300000.00",
                },
                request_only=True,
            )
        ],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "No fue posible crear el bank movement.",
                serializer.errors,
                status.HTTP_400_BAD_REQUEST,
            )

        bank_movement = serializer.save()
        response_serializer = self.get_serializer(bank_movement)
        return success_response(
            "Bank movement creado correctamente.",
            response_serializer.data,
            status.HTTP_201_CREATED,
        )


class BankMovementDetailView(generics.RetrieveUpdateDestroyAPIView):
    # El detalle del movimiento mantiene el mismo shape del listado para no duplicar contratos.
    queryset = BankMovement.objects.all()
    serializer_class = BankMovementSerializer

    @extend_schema(
        summary="Obtener transferencia",
        description="Retorna el detalle de una transferencia con su saldo disponible.",
        responses={
            200: BankMovementResponseSerializer,
            404: OpenApiResponse(
                response=ErrorResponseSerializer,
                description="Transferencia no encontrada.",
            ),
        },
    )
    def retrieve(self, request, *args, **kwargs):  # noqa: ARG002
        bank_movement = self.get_object()
        serializer = self.get_serializer(bank_movement)
        return success_response(
            "Bank movement obtenido correctamente.",
            serializer.data,
            status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Editar transferencia",
        description="Actualiza un movimiento bancario si aun no tiene asignaciones de pago.",
        request=BankMovementSerializer,
        responses={
            200: BankMovementResponseSerializer,
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Datos invalidos."),
            404: OpenApiResponse(
                response=ErrorResponseSerializer,
                description="Transferencia no encontrada.",
            ),
        },
    )
    def patch(self, request, *args, **kwargs):
        bank_movement = self.get_object()
        if bank_movement.payment_allocations.exists():
            return error_response(
                "No fue posible actualizar el bank movement.",
                {"detail": "No puedes editar un movimiento que ya tiene asignaciones asociadas."},
                status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(bank_movement, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                "No fue posible actualizar el bank movement.",
                serializer.errors,
                status.HTTP_400_BAD_REQUEST,
            )

        updated_bank_movement = serializer.save()
        response_serializer = self.get_serializer(updated_bank_movement)
        return success_response(
            "Bank movement actualizado correctamente.",
            response_serializer.data,
            status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Eliminar transferencia",
        description="Elimina una transferencia solo si aun no tiene asignaciones asociadas.",
        responses={
            200: EmptySuccessResponseSerializer,
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description="La transferencia ya tiene asignaciones asociadas.",
            ),
            404: OpenApiResponse(
                response=ErrorResponseSerializer,
                description="Transferencia no encontrada.",
            ),
        },
    )
    def delete(self, request, *args, **kwargs):  # noqa: ARG002
        bank_movement = self.get_object()

        # Evita borrar transferencias que ya explican pagos del historico.
        if bank_movement.payment_allocations.exists():
            return error_response(
                "No fue posible eliminar el bank movement.",
                {"detail": "No puedes eliminar un movimiento que ya tiene asignaciones asociadas."},
                status.HTTP_400_BAD_REQUEST,
            )

        bank_movement.delete()
        return success_response(
            "Bank movement eliminado correctamente.",
            {"detail": "El movimiento fue eliminado."},
            status.HTTP_200_OK,
        )


class ReconciliationCreateView(APIView):
    # La conciliacion usa APIView porque requiere una operacion de negocio especifica.
    @extend_schema(
        summary="Conciliar transferencia",
        description=(
            "Asigna una transferencia a uno o mas cobros. "
            "Cada asignacion indica cuanto abonar en CLP."
        ),
        request=ReconciliationSerializer,
        responses={
            201: ReconciliationResponseSerializer,
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description="La conciliacion viola reglas de negocio.",
            ),
            405: OpenApiResponse(
                response=ErrorResponseSerializer,
                description="Metodo HTTP no permitido.",
            ),
        },
        examples=[
            OpenApiExample(
                "Conciliacion parcial a varios cobros",
                value={
                    "bank_movement_id": 1,
                    "allocations": [
                        {"collection_id": 10, "amount_clp": "50000.00"},
                        {"collection_id": 11, "amount_clp": "30000.00"},
                    ],
                },
                request_only=True,
            )
        ],
    )
    def post(self, request, *args, **kwargs):  # noqa: ARG002
        serializer = ReconciliationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "No fue posible conciliar el movimiento.",
                serializer.errors,
                status.HTTP_400_BAD_REQUEST,
            )

        bank_movement = serializer.validated_data["bank_movement"]
        collections_by_id = serializer.validated_data["collections_by_id"]
        allocations = serializer.validated_data["allocations"]

        created_allocations = []
        with transaction.atomic():
            # La conciliacion completa se guarda o se rechaza como un solo bloque.
            for allocation in allocations:
                # Cada fila representa cuanto de un movimiento se aplica a un cobro.
                payment_allocation = PaymentAllocation.objects.create(
                    bank_movement=bank_movement,
                    collection=collections_by_id[allocation["collection_id"]],
                    amount_clp=allocation["amount_clp"],
                )
                created_allocations.append(payment_allocation)

        bank_movement.refresh_from_db()
        affected_collections = Collection.objects.prefetch_related(
            "payment_allocations__bank_movement"
        ).filter(id__in=collections_by_id.keys())

        return success_response(
            "Conciliacion creada correctamente.",
            {
                "bank_movement": BankMovementSerializer(bank_movement).data,
                "allocations_created": len(created_allocations),
                "collections": CollectionSerializer(affected_collections, many=True).data,
            },
            status.HTTP_201_CREATED,
        )


class CollectionHistoryView(generics.ListAPIView):
    # El historico reutiliza collections enriquecidas para distinguir pendientes y pagadas.
    queryset = Collection.objects.prefetch_related("payment_allocations__bank_movement").all()
    serializer_class = CollectionSerializer

    @extend_schema(
        summary="Historico de cobros",
        description="Retorna el historico completo de cobros con pagos asociados y saldos.",
        responses={
            200: CollectionListResponseSerializer,
        },
    )
    def list(self, request, *args, **kwargs):  # noqa: ARG002
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(
            "Historico de collections obtenido correctamente.",
            serializer.data,
            status.HTTP_200_OK,
        )
