from django.shortcuts import render
from .models import Product, Order, OrderItem, User
from .serializers import ProductSerializer, OrderSerializer, RegisterSerializer, LoginSerializer, OrderCreateSerializer
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
from datetime import datetime, timezone, timedelta
import base58

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

class OrderCreateApiView(generics.CreateAPIView):
#    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]


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
#        tokens = get_tokens_for_user(user)

        return Response(
            {
                "user": RegisterSerializer(user).data,
#                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        nonce = secrets.token_hex(16)
        issued_at = datetime.now(timezone.utc)

        user.login_nonce = nonce
        user.nonce_issued_at = issued_at
        user.save(update_fields=["login_nonce", "nonce_issued_at"])

        message = f"""Blockbite Authentication

Domain: Blockbite.app
Wallet: {user.wallet_address}
Nonce: {nonce}
Issued At: {issued_at.isoformat()}
Purpose: Sign this message to verify wallet ownership and continue login.
"""

        return Response(
            {
                "nonce": nonce,
                "message": message
            },
            status=status.HTTP_200_OK,
        )


class VerifyLoginView(APIView):
    def post(self, request):
#        email = request.data.get("email")
        wallet = request.data.get("wallet_address")
        signature = request.data.get("signature")
        nonce = request.data.get("nonce")

        if isinstance(wallet, (bytes, bytearray)):
            wallet = wallet.decode()
        if isinstance(signature, (bytes, bytearray)):
            signature = signature.decode()

        print("wallet type:", type(wallet), "->", wallet[:10])
        print("signature type:", type(signature), "->", signature[:10])

        try:
            user = User.objects.get(wallet_address=wallet)
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

        if user.nonce_issued_at:
            if datetime.now(timezone.utc) - user.nonce_issued_at > timedelta(minutes=5):
                return Response(
                    {
                        "error": "nonce expired"
                    },
                    status=400
                )

        issued_at_str = user.nonce_issued_at.isoformat()
        message = f"""Blockbite Authentication

Domain: Blockbite.app
Wallet: {wallet}
Nonce: {nonce}
Issued At: {issued_at_str}
Purpose: Sign this message to verify wallet ownership and continue login.
"""

        try:
            sig = Signature.from_string(signature)
            pubkey = Pubkey(base58.b58decode(wallet))  

            if not sig.verify(message.encode("utf-8"), pubkey):
                return Response(
                    {
                        "error": "signature invalid"
                    },
                    status=400
                )
        except Exception as e:
            return Response(
                {
                    "error": f"verification failed: {str(e)}"
                },
                status=400
            )

        # success
        user.login_nonce = None
        user.nonce_issued_at = None
        user.save(update_fields=["login_nonce", "nonce_issued_at"])

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": RegisterSerializer(user).data,
                "tokens": tokens
            }
        )
