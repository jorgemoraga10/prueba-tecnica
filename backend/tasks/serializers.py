from decimal import Decimal

from rest_framework import serializers

from tasks.models import BankMovement, Collection, PaymentAllocation


class PaymentAllocationDetailSerializer(serializers.ModelSerializer):
    bank_movement_id = serializers.IntegerField(source="bank_movement.id", read_only=True)
    fecha = serializers.DateField(source="bank_movement.fecha", read_only=True)
    glosa = serializers.CharField(source="bank_movement.glosa", read_only=True)

    class Meta:
        model = PaymentAllocation
        fields = ["id", "bank_movement_id", "fecha", "glosa", "amount_clp", "created_at"]


class CollectionSerializer(serializers.ModelSerializer):
    monto_cobro_clp = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_paid_clp = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    remaining_amount_clp = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    payments = PaymentAllocationDetailSerializer(
        source="payment_allocations",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Collection
        fields = [
            "id",
            "contract_id",
            "mes_cobro",
            "monto_cobro",
            "moneda",
            "monto_cobro_clp",
            "total_paid_clp",
            "remaining_amount_clp",
            "payments",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs: dict) -> dict:
        # Rechaza fechas con dia distinto de 1 para mantener el cobro mensual consistente.
        mes_cobro = attrs.get("mes_cobro")
        if mes_cobro is not None and mes_cobro.day != 1:
            raise serializers.ValidationError(
                {"mes_cobro": "El mes_cobro debe usar el primer dia del mes."}
            )
        return attrs


class BankMovementSerializer(serializers.ModelSerializer):
    assigned_amount_clp = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    available_amount_clp = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = BankMovement
        fields = [
            "id",
            "fecha",
            "glosa",
            "monto",
            "assigned_amount_clp",
            "available_amount_clp",
            "created_at",
            "updated_at",
        ]


class ReconciliationAllocationSerializer(serializers.Serializer):
    collection_id = serializers.IntegerField(min_value=1)
    amount_clp = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal("0.01"))


class ReconciliationSerializer(serializers.Serializer):
    bank_movement_id = serializers.IntegerField(min_value=1)
    allocations = ReconciliationAllocationSerializer(many=True)

    def validate_bank_movement_id(self, value: int) -> int:
        # Obliga a que la conciliacion apunte a un movimiento existente.
        if not BankMovement.objects.filter(pk=value).exists():
            raise serializers.ValidationError("El bank_movement_id no existe.")
        return value

    def validate_allocations(self, value: list[dict]) -> list[dict]:
        # Evita solicitudes vacias y cobros repetidos dentro del mismo lote.
        if not value:
            raise serializers.ValidationError("Debes enviar al menos una asignacion.")

        seen_collection_ids: set[int] = set()
        for allocation in value:
            collection_id = allocation["collection_id"]
            if collection_id in seen_collection_ids:
                raise serializers.ValidationError(
                    f"El collection_id {collection_id} esta repetido en la solicitud."
                )
            seen_collection_ids.add(collection_id)

        return value

    def validate(self, attrs: dict) -> dict:
        bank_movement = BankMovement.objects.get(pk=attrs["bank_movement_id"])
        allocations = attrs["allocations"]

        collection_ids = [allocation["collection_id"] for allocation in allocations]
        collections = Collection.objects.in_bulk(collection_ids)

        missing_ids = [collection_id for collection_id in collection_ids if collection_id not in collections]
        if missing_ids:
            raise serializers.ValidationError(
                {"allocations": [f"Los collection_id no existen: {missing_ids}."]}
            )

        total_requested = sum(
            (allocation["amount_clp"] for allocation in allocations),
            start=Decimal("0"),
        )
        if total_requested > bank_movement.available_amount_clp:
            raise serializers.ValidationError(
                {
                    "allocations": [
                        "La suma de asignaciones excede el saldo disponible del movimiento."
                    ]
                }
            )

        for allocation in allocations:
            collection = collections[allocation["collection_id"]]
            amount_clp = allocation["amount_clp"]

            # Cada cobro solo puede recibir hasta lo que aun le falta en CLP.
            if amount_clp > collection.remaining_amount_clp:
                raise serializers.ValidationError(
                    {
                        "allocations": [
                            (
                                f"La collection {collection.id} solo tiene "
                                f"{collection.remaining_amount_clp} CLP pendientes."
                            )
                        ]
                    }
                )

        attrs["bank_movement"] = bank_movement
        attrs["collections_by_id"] = collections
        return attrs


class SuccessEnvelopeSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


class CollectionListResponseSerializer(SuccessEnvelopeSerializer):
    data = CollectionSerializer(many=True)


class CollectionResponseSerializer(SuccessEnvelopeSerializer):
    data = CollectionSerializer()


class EmptyResponseDataSerializer(serializers.Serializer):
    detail = serializers.CharField()


class EmptySuccessResponseSerializer(SuccessEnvelopeSerializer):
    data = EmptyResponseDataSerializer()


class BankMovementListResponseSerializer(SuccessEnvelopeSerializer):
    data = BankMovementSerializer(many=True)


class BankMovementResponseSerializer(SuccessEnvelopeSerializer):
    data = BankMovementSerializer()


class ReconciliationResponseDataSerializer(serializers.Serializer):
    bank_movement = BankMovementSerializer()
    allocations_created = serializers.IntegerField()
    collections = CollectionSerializer(many=True)


class ReconciliationResponseSerializer(SuccessEnvelopeSerializer):
    data = ReconciliationResponseDataSerializer()


class ErrorResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    errors = serializers.JSONField()
