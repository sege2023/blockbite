from django.shortcuts import render
from .models import Product, Order, OrderItem, User
from .serializers import ProductSerializer, OrderSerializer, RegisterSerializer, LoginSerializer
from rest_framework.viewsets import generics
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .filters import ProductFilter, InStockFilterBackend
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
import secrets
from solders.pubkey import Pubkey
from solders.signature import Signature
from solders.message import Message

# Create your views here.

class ProductListCreateApiView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(stock__gt=0)
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
        InStockFilterBackend
    ]
    search_fields = ['name', 'description']
    ordering_fields = ['name','price','stock']

    def get_permissions(self):
        self.permission_classes = [AllowAny]
        if self.request.method == "POST":
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()


class ProductRetrieveUpdateDelete(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        self.permission_classes = [AllowAny]
        if self.request.method in ['PUT','PATCH','DELETE']:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()
    

class OrderListApiView(generics.ListAPIView):
    queryset = Order.objects.prefetch_related('items__product')
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]


class UserOrderListApiView(generics.ListAPIView):
    queryset = Order.objects.prefetch_related('items__product')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        return qs.filter(user=user)
    

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

class RegisterView(APIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)

        return Response(
            {
                "user": RegisterSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)

        return Response(
            {
                "user": RegisterSerializer(user).data,
                "tokens": tokens,
            },
             status=status.HTTP_200_OK,
        )

class RequestChallenge(APIView):
    def post(self, request):
        email = request.data.get("email")
        wallet = request.data.get("wallet_address")

        try:
            user = User.objects.get(email=email, wallet_address=wallet)
        except User.DoesNotExist:
            return Response(
                {
                    "error": "Invalid credentials"
                },
                status=400
            )
        
        nonce = secrets.token_hex(16)
        user.login_nonce = nonce
        user.save(update_fields=["login_nonce"])

        return Response(
            {
                "nonce": nonce
            }
        )
    

class VerifyLoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        wallet = request.data.get("wallet_address")
        signature = request.data.get("signature")
        nonce = request.data.get("nonce")

        try:
            user = User.objects.get(email=email, wallet_address=wallet,)
        except User.DoesNotExist:
            return Response(
                {
                    "error": "invalid credentials"
                },
                status=400
            )
        
        if user.login_nonce != nonce:
            return Response(
                {
                    "error": "invalid nonce"
                },
                status=400
            )
        
        #verify
        message = nonce.encode("utf-8")
        sig = Signature.from_string(signature)
        pubkey = Pubkey.from_string(wallet)

        if not pubkey.verify(message, sig):
            return Response(
                {
                    "error": "signature invalid"
                },
                status=400
            )
        
        #success
        user.login_nonce = None
        user.save(update_fields=["login_nonce"])

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": RegisterSerializer(user).data,
                "tokens": tokens
            }
        )
#class UserListApiView(generics.ListAPIView):
#    queryset = User.objects.all()
#    serializer_class = UserSerializer
#    permission_classes = [IsAdminUser]