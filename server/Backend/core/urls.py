from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListCreateApiView.as_view()),
    path('products/<pk>/', views.ProductDetailApiView.as_view()),
    path('orders/', views.OrderListApiView.as_view()),
    path('user-orders/', views.UserOrderListApiView.as_view()),
]