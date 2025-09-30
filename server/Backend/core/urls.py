from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListCreateApiView.as_view()),
    path('products/<pk>/', views.ProductRetrieveUpdateDelete.as_view()),
    path('orders/', views.OrderListApiView.as_view()),
    path('user-orders/', views.UserOrderListApiView.as_view()),
    path('create-orders/', views.OrderCreateApiView.as_view()),
    path("api/user/register/", views.RegisterView.as_view(), name="register"),
    path("api/auth/", views.LoginView.as_view(), name="login"),
#    path("api/user/request-challenge/", views.RequestChallenge.as_view(), name="login"),
    path("api/user/verify-login/", views.VerifyLoginView.as_view(), name="login"),
#    path("users", views.UserListApiView.as_view(), name="users"),
    path('api/prepare_checkout/', views.prepare_checkout, name='prepare_checkout'),
    path('api/save_transaction/', views.save_transaction, name='save_transaction'),
]