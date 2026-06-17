from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import BankMovement, Collection, PaymentAllocation


class TasksApiTests(APITestCase):
    def create_collection(
        self,
        *,
        contract_id: int = 123,
        mes_cobro: str = "2026-04-01",
        monto_cobro: str = "100000.00",
        moneda: str = Collection.Currency.CLP,
    ) -> Collection:
        return Collection.objects.create(
            contract_id=contract_id,
            mes_cobro=mes_cobro,
            monto_cobro=Decimal(monto_cobro),
            moneda=moneda,
        )

    def create_bank_movement(
        self,
        *,
        fecha: str = "2026-04-15",
        glosa: str = "Transferencia",
        monto: str = "150000.00",
    ) -> BankMovement:
        return BankMovement.objects.create(
            fecha=fecha,
            glosa=glosa,
            monto=Decimal(monto),
        )

    def test_create_collection_returns_success_json(self):
        response = self.client.post(
            reverse("collection-list-create"),
            {
                "contract_id": 1001,
                "mes_cobro": "2026-05-01",
                "monto_cobro": "250000.00",
                "moneda": "CLP",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["contract_id"], 1001)
        self.assertEqual(Collection.objects.count(), 1)

    def test_create_collection_rejects_invalid_month_day(self):
        response = self.client.post(
            reverse("collection-list-create"),
            {
                "contract_id": 1001,
                "mes_cobro": "2026-05-10",
                "monto_cobro": "250000.00",
                "moneda": "CLP",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("mes_cobro", response.data["errors"])

    def test_create_bank_movement_returns_success_json(self):
        response = self.client.post(
            reverse("bank-movement-list-create"),
            {
                "fecha": "2026-04-20",
                "glosa": "Pago arriendo abril",
                "monto": "300000.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["available_amount_clp"], "300000.00")
        self.assertEqual(BankMovement.objects.count(), 1)

    def test_reconciliation_creates_partial_payment(self):
        collection = self.create_collection(monto_cobro="100000.00")
        bank_movement = self.create_bank_movement(monto="80000.00")

        response = self.client.post(
            reverse("reconciliation-create"),
            {
                "bank_movement_id": bank_movement.id,
                "allocations": [
                    {
                        "collection_id": collection.id,
                        "amount_clp": "40000.00",
                    }
                ],
            },
            format="json",
        )

        collection.refresh_from_db()
        bank_movement.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["allocations_created"], 1)
        self.assertEqual(PaymentAllocation.objects.count(), 1)
        self.assertEqual(collection.total_paid_clp, Decimal("40000.00"))
        self.assertEqual(collection.remaining_amount_clp, Decimal("60000.00"))
        self.assertEqual(bank_movement.available_amount_clp, Decimal("40000.00"))

    def test_reconciliation_rejects_when_total_exceeds_bank_movement_balance(self):
        first_collection = self.create_collection(contract_id=1, monto_cobro="90000.00")
        second_collection = self.create_collection(
            contract_id=2,
            monto_cobro="90000.00",
            mes_cobro="2026-05-01",
        )
        bank_movement = self.create_bank_movement(monto="100000.00")

        response = self.client.post(
            reverse("reconciliation-create"),
            {
                "bank_movement_id": bank_movement.id,
                "allocations": [
                    {"collection_id": first_collection.id, "amount_clp": "60000.00"},
                    {"collection_id": second_collection.id, "amount_clp": "50000.00"},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(PaymentAllocation.objects.count(), 0)

    def test_reconciliation_rejects_when_collection_receives_more_than_pending(self):
        collection = self.create_collection(monto_cobro="70000.00")
        bank_movement = self.create_bank_movement(monto="150000.00")

        response = self.client.post(
            reverse("reconciliation-create"),
            {
                "bank_movement_id": bank_movement.id,
                "allocations": [
                    {
                        "collection_id": collection.id,
                        "amount_clp": "80000.00",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(PaymentAllocation.objects.count(), 0)

    def test_reconciliation_supports_full_payment_for_uf_collection(self):
        collection = self.create_collection(monto_cobro="2.00", moneda=Collection.Currency.UF)
        bank_movement = self.create_bank_movement(monto="100000.00")

        response = self.client.post(
            reverse("reconciliation-create"),
            {
                "bank_movement_id": bank_movement.id,
                "allocations": [
                    {
                        "collection_id": collection.id,
                        "amount_clp": "80000.00",
                    }
                ],
            },
            format="json",
        )

        collection.refresh_from_db()
        bank_movement.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(collection.remaining_amount_clp, Decimal("0"))
        self.assertEqual(bank_movement.available_amount_clp, Decimal("20000.00"))

    def test_reconciliation_allows_using_remaining_balance_in_second_operation(self):
        first_collection = self.create_collection(contract_id=1, monto_cobro="60000.00")
        second_collection = self.create_collection(
            contract_id=2,
            monto_cobro="50000.00",
            mes_cobro="2026-05-01",
        )
        bank_movement = self.create_bank_movement(monto="100000.00")

        first_response = self.client.post(
            reverse("reconciliation-create"),
            {
                "bank_movement_id": bank_movement.id,
                "allocations": [
                    {"collection_id": first_collection.id, "amount_clp": "60000.00"}
                ],
            },
            format="json",
        )
        second_response = self.client.post(
            reverse("reconciliation-create"),
            {
                "bank_movement_id": bank_movement.id,
                "allocations": [
                    {"collection_id": second_collection.id, "amount_clp": "40000.00"}
                ],
            },
            format="json",
        )

        bank_movement.refresh_from_db()
        second_collection.refresh_from_db()

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PaymentAllocation.objects.count(), 2)
        self.assertEqual(bank_movement.available_amount_clp, Decimal("0"))
        self.assertEqual(second_collection.remaining_amount_clp, Decimal("10000.00"))

    def test_collection_history_returns_payment_detail(self):
        collection = self.create_collection(monto_cobro="120000.00")
        bank_movement = self.create_bank_movement(monto="120000.00", glosa="Pago total")
        PaymentAllocation.objects.create(
            bank_movement=bank_movement,
            collection=collection,
            amount_clp=Decimal("120000.00"),
        )

        response = self.client.get(reverse("collection-history"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["total_paid_clp"], "120000.00")
        self.assertEqual(response.data["data"][0]["payments"][0]["glosa"], "Pago total")

    def test_collection_detail_returns_json_404_shape(self):
        response = self.client.get(reverse("collection-detail", kwargs={"pk": 9999}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "El recurso solicitado no existe.")
        self.assertIn("detail", response.data["errors"])

    def test_reconciliation_endpoint_returns_json_405_shape(self):
        response = self.client.get(reverse("reconciliation-create"))

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["message"],
            "El metodo HTTP no esta permitido para este endpoint.",
        )
        self.assertIn("detail", response.data["errors"])

    def test_collection_patch_updates_existing_collection(self):
        collection = self.create_collection()

        response = self.client.patch(
            reverse("collection-detail", kwargs={"pk": collection.id}),
            {
                "monto_cobro": "125000.00",
                "moneda": "CLP",
            },
            format="json",
        )

        collection.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(collection.monto_cobro, Decimal("125000.00"))

    def test_collection_delete_removes_collection_without_payments(self):
        collection = self.create_collection()

        response = self.client.delete(reverse("collection-detail", kwargs={"pk": collection.id}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(Collection.objects.count(), 0)

    def test_collection_delete_rejects_collection_with_payments(self):
        collection = self.create_collection()
        bank_movement = self.create_bank_movement()
        PaymentAllocation.objects.create(
            bank_movement=bank_movement,
            collection=collection,
            amount_clp=Decimal("10000.00"),
        )

        response = self.client.delete(reverse("collection-detail", kwargs={"pk": collection.id}))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(Collection.objects.count(), 1)

    def test_collection_patch_rejects_collection_with_payments(self):
        collection = self.create_collection()
        bank_movement = self.create_bank_movement()
        PaymentAllocation.objects.create(
            bank_movement=bank_movement,
            collection=collection,
            amount_clp=Decimal("10000.00"),
        )

        response = self.client.patch(
            reverse("collection-detail", kwargs={"pk": collection.id}),
            {
                "monto_cobro": "125000.00",
            },
            format="json",
        )

        collection.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(collection.monto_cobro, Decimal("100000.00"))

    def test_bank_movement_patch_updates_existing_movement(self):
        bank_movement = self.create_bank_movement()

        response = self.client.patch(
            reverse("bank-movement-detail", kwargs={"pk": bank_movement.id}),
            {
                "glosa": "Transferencia actualizada",
            },
            format="json",
        )

        bank_movement.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(bank_movement.glosa, "Transferencia actualizada")

    def test_bank_movement_delete_removes_movement_without_allocations(self):
        bank_movement = self.create_bank_movement()

        response = self.client.delete(
            reverse("bank-movement-detail", kwargs={"pk": bank_movement.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(BankMovement.objects.count(), 0)

    def test_bank_movement_delete_rejects_movement_with_allocations(self):
        bank_movement = self.create_bank_movement()
        collection = self.create_collection()
        PaymentAllocation.objects.create(
            bank_movement=bank_movement,
            collection=collection,
            amount_clp=Decimal("10000.00"),
        )

        response = self.client.delete(
            reverse("bank-movement-detail", kwargs={"pk": bank_movement.id})
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(BankMovement.objects.count(), 1)

    def test_bank_movement_patch_rejects_movement_with_allocations(self):
        bank_movement = self.create_bank_movement()
        collection = self.create_collection()
        PaymentAllocation.objects.create(
            bank_movement=bank_movement,
            collection=collection,
            amount_clp=Decimal("10000.00"),
        )

        response = self.client.patch(
            reverse("bank-movement-detail", kwargs={"pk": bank_movement.id}),
            {
                "glosa": "Transferencia actualizada",
            },
            format="json",
        )

        bank_movement.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(bank_movement.glosa, "Transferencia")
