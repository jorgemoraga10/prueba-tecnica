from decimal import Decimal

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="BankMovement",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("fecha", models.DateField()),
                ("glosa", models.CharField(max_length=255)),
                (
                    "monto",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=14,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                    ),
                ),
                ("created_at", models.DateTimeField(default=timezone.now, editable=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-fecha", "id"],
            },
        ),
        migrations.CreateModel(
            name="Collection",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("contract_id", models.PositiveIntegerField()),
                ("mes_cobro", models.DateField()),
                (
                    "monto_cobro",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=12,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                    ),
                ),
                ("moneda", models.CharField(choices=[("CLP", "CLP"), ("UF", "UF")], max_length=3)),
                ("created_at", models.DateTimeField(default=timezone.now, editable=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-mes_cobro", "id"],
            },
        ),
        migrations.CreateModel(
            name="PaymentAllocation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "amount_clp",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=14,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                    ),
                ),
                ("created_at", models.DateTimeField(default=timezone.now, editable=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "bank_movement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_allocations",
                        to="tasks.bankmovement",
                    ),
                ),
                (
                    "collection",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_allocations",
                        to="tasks.collection",
                    ),
                ),
            ],
            options={
                "ordering": ["created_at", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="bankmovement",
            constraint=models.CheckConstraint(
                condition=models.Q(("monto__gt", 0)),
                name="bank_movement_amount_gt_zero",
            ),
        ),
        migrations.AddConstraint(
            model_name="collection",
            constraint=models.CheckConstraint(
                condition=models.Q(("monto_cobro__gt", 0)),
                name="collection_amount_gt_zero",
            ),
        ),
        migrations.AddConstraint(
            model_name="collection",
            constraint=models.UniqueConstraint(
                fields=("contract_id", "mes_cobro", "moneda"),
                name="unique_collection_per_contract_month_currency",
            ),
        ),
        migrations.AddConstraint(
            model_name="paymentallocation",
            constraint=models.CheckConstraint(
                condition=models.Q(("amount_clp__gt", 0)),
                name="payment_allocation_amount_gt_zero",
            ),
        ),
    ]
