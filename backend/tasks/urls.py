from django.urls import path

from tasks.views import (
    BankMovementDetailView,
    BankMovementListCreateView,
    CollectionDetailView,
    CollectionHistoryView,
    CollectionListCreateView,
    ReconciliationCreateView,
)

urlpatterns = [
    path("collections/", CollectionListCreateView.as_view(), name="collection-list-create"),
    path("collections/history/", CollectionHistoryView.as_view(), name="collection-history"),
    path("collections/<int:pk>/", CollectionDetailView.as_view(), name="collection-detail"),
    path(
        "bank-movements/",
        BankMovementListCreateView.as_view(),
        name="bank-movement-list-create",
    ),
    path(
        "bank-movements/<int:pk>/",
        BankMovementDetailView.as_view(),
        name="bank-movement-detail",
    ),
    path("reconciliations/", ReconciliationCreateView.as_view(), name="reconciliation-create"),
]
