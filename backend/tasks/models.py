from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import CheckConstraint, Q, Sum
from django.utils import timezone

UF_VALUE_CLP = Decimal("40000")


class Collection(models.Model):
    class Currency(models.TextChoices):
        CLP = "CLP", "CLP"
        UF = "UF", "UF"

    contract_id = models.PositiveIntegerField()
    mes_cobro = models.DateField()
    monto_cobro = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    moneda = models.CharField(max_length=3, choices=Currency.choices)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-mes_cobro", "id"]
        constraints = [
            # Evita guardar cobros con monto cero o negativo.
            CheckConstraint(
                condition=Q(monto_cobro__gt=0),
                name="collection_amount_gt_zero",
            ),
            # Evita duplicar el mismo cobro mensual para un contrato y moneda.
            models.UniqueConstraint(
                fields=["contract_id", "mes_cobro", "moneda"],
                name="unique_collection_per_contract_month_currency",
            ),
        ]

    def __str__(self) -> str:
        return f"Collection #{self.pk} contract {self.contract_id} {self.moneda}"

    @property
    def monto_cobro_clp(self) -> Decimal:
        # Convierte los cobros UF a CLP usando la tasa fija del enunciado.
        if self.moneda == self.Currency.UF:
            return self.monto_cobro * UF_VALUE_CLP
        return self.monto_cobro

    @property
    def total_paid_clp(self) -> Decimal:
        # Suma todos los abonos asociados al cobro en pesos.
        total = self.payment_allocations.aggregate(total=Sum("amount_clp"))["total"]
        return total or Decimal("0")

    @property
    def remaining_amount_clp(self) -> Decimal:
        # Nunca devolvemos saldo pendiente negativo aunque exista redondeo o inconsistencia.
        remaining = self.monto_cobro_clp - self.total_paid_clp
        return max(remaining, Decimal("0"))


class BankMovement(models.Model):
    fecha = models.DateField()
    glosa = models.CharField(max_length=255)
    monto = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-fecha", "id"]
        constraints = [
            # Asegura que toda transferencia exista con monto positivo.
            CheckConstraint(
                condition=Q(monto__gt=0),
                name="bank_movement_amount_gt_zero",
            ),
        ]

    def __str__(self) -> str:
        return f"BankMovement #{self.pk} {self.fecha} {self.monto}"

    @property
    def assigned_amount_clp(self) -> Decimal:
        # Calcula cuanto del movimiento ya fue repartido entre cobros.
        total = self.payment_allocations.aggregate(total=Sum("amount_clp"))["total"]
        return total or Decimal("0")

    @property
    def available_amount_clp(self) -> Decimal:
        # Este es el excedente reutilizable del movimiento para futuras conciliaciones.
        remaining = self.monto - self.assigned_amount_clp
        return max(remaining, Decimal("0"))


class PaymentAllocation(models.Model):
    bank_movement = models.ForeignKey(
        BankMovement,
        on_delete=models.CASCADE,
        related_name="payment_allocations",
    )
    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name="payment_allocations",
    )
    amount_clp = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]
        constraints = [
            # Cada asignacion debe representar un abono real positivo.
            CheckConstraint(
                condition=Q(amount_clp__gt=0),
                name="payment_allocation_amount_gt_zero",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"PaymentAllocation #{self.pk} movement {self.bank_movement_id} "
            f"collection {self.collection_id}"
        )
