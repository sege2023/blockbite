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
# import based58
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
# import base58
# import based58
from rest_framework.authtoken.models import Token


import os
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from asgiref.sync import sync_to_async
from asgiref.sync import async_to_sync
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import authentication_classes, permission_classes, api_view
# from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
# from solana.keypair import Keypair
from solders.keypair import Keypair
# from solana.publickey import PublicKey
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
# from solana.system_program import SYS_PROGRAM_ID
from solders.system_program import ID as SYS_PROGRAM_ID
# from solana.utils.
from anchorpy import Program, Provider, Idl
from pathlib import Path
from .serializers import OrderCreateSerializer

RPC_URL = "https://api.devnet.solana.com"
PROGRAM_ID = Pubkey.from_string("9WAZQTunxCMK9cJbn67vDrFhtsYPDCZpuJzquyH4NnKx")
VENDOR_PUBKEY = Pubkey.from_string("CZmkNn3pixHtcWF5dRPY87Pd2uyJWrvgtN8rmbiQGGkZ")
mint = os.getenv('MINT')
MINT = Pubkey.from_string(mint)
VENDOR_KEYPAIR = Keypair.from_base58_string(os.getenv('VENDOR_PRIVATE_KEY'))

async def get_program():
    client = AsyncClient(RPC_URL)
    idl_path = Path('backend/idl/onchain.json')  # Ensure IDL is in repo
    with open(idl_path, 'r') as f:
        idl = Idl.from_json(f.read())
    provider = Provider(client, VENDOR_KEYPAIR)
    program = Program(idl, PROGRAM_ID, provider)
    return program

def _prepare_checkout_sync(data, request):
    """Sync version of prepare_checkout"""
    serializer = OrderCreateSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        order = serializer.save(vendor=str(VENDOR_PUBKEY))
        return order, None
    return None, serializer.errors

# @api_view(['POST'])
# @authentication_classes([SessionAuthentication, TokenAuthentication])
# @permission_classes([IsAuthenticated])
# @csrf_exempt
# async def prepare_checkout(request):
#     # if request.method == 'POST':
#         # data = json.loads(request.body)
        
#         if request.method != 'POST':
#             return JsonResponse({'error': 'Method not allowed'}, status=405)
        
#         # Manual token authentication
#         auth_header = request.META.get('HTTP_AUTHORIZATION', '')
#         if not auth_header.startswith('Bearer '):
#             return JsonResponse({'error': 'Authentication required'}, status=401)
        
#         token_key = auth_header.split(' ')[1]
#         try:
#             token = await sync_to_async(Token.objects.get)(key=token_key)
#             user = token.user
#         except Token.DoesNotExist:
#             return JsonResponse({'error': 'Invalid token'}, status=401)
        
#         # Parse data
#         try:
#             data = json.loads(request.body)
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)
        


#         # data = request.data
#         def _prepare_checkout_sync(data, user):
#             """Sync version of prepare_checkout"""
#             # context = {'user':user}
#             serializer = OrderCreateSerializer(data=data)
#             if serializer.is_valid():
#                 order = serializer.save(vendor=str(VENDOR_PUBKEY))
#                 order.user = user
#                 order.save()
#                 return order, None
#             return None, serializer.errors
#         # serializer = OrderCreateSerializer(data=data, context={'request': request})
#         order, errors = await sync_to_async(_prepare_checkout_sync)(data, user)
#         if order:
#             # Create DB order
#             # order = await sync_to_async(serializer.save)(vendor=str(VENDOR_PUBKEY))  # Set vendor
            
#             # Create on-chain order
#             program = await get_program()
#             order_id = order.order_id
#             price = int(float(order.total_price) * 10**6)  # USDC decimals=6
            
#             order_pda = Pubkey.find_program_address(
#                 [b"order", order_id.to_bytes(8, 'le')],
#                 PROGRAM_ID
#             )[0]
            
#             await program.rpc["add_order"](order_id, price, ctx={"accounts": {
#                 "order": order_pda,
#                 "vendor": VENDOR_KEYPAIR.public_key,
#                 "system_program": SYS_PROGRAM_ID,
#             }})
            
#             return JsonResponse({
#                 'orderId': order_id,
#                 'price': price,
#                 'vendor': str(VENDOR_PUBKEY),
#                 'mint': str(MINT),
#             })
#         return JsonResponse(errors, status=400)
#     # return JsonResponse({'error': 'Invalid method'}, status=400)

# @api_view(['POST'])
# @authentication_classes([TokenAuthentication])
# @permission_classes([IsAuthenticated])
# async def prepare_checkout(request):
#     if request.method != 'POST':
#         return JsonResponse({'error': 'Method not allowed'}, status=405)
    
#     # User is already authenticated by decorators
#     user = await sync_to_async(lambda: request.user)()
    
#     # Parse data
#     try:
#         data = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
#     def _prepare_checkout_sync(data, user):
#         """Sync version of prepare_checkout"""
#         serializer = OrderCreateSerializer(data=data)
#         if serializer.is_valid():
#             order = serializer.save(vendor=str(VENDOR_PUBKEY))
#             order.user = user
#             order.save()
#             return order, None
#         return None, serializer.errors
    
#     # Create order
#     order, errors = await sync_to_async(_prepare_checkout_sync)(data, user)
    
#     if order:
#         # Create on-chain order
#         program = await get_program()
#         order_id = order.order_id
#         price = int(float(order.total_price) * 10**6)  # USDC decimals=6
        
#         order_pda = Pubkey.find_program_address(
#             [b"order", order_id.to_bytes(8, 'le')],
#             PROGRAM_ID
#         )[0]
        
#         await program.rpc["add_order"](order_id, price, ctx={"accounts": {
#             "order": order_pda,
#             "vendor": VENDOR_KEYPAIR.public_key,
#             "system_program": SYS_PROGRAM_ID,
#         }})
        
#         return JsonResponse({
#             'orderId': order_id,
#             'price': price,
#             'vendor': str(VENDOR_PUBKEY),
#             'mint': str(MINT),
#         })
    
#     return JsonResponse(errors, status=400)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])  # Changed to JWT!
@permission_classes([IsAuthenticated])
def prepare_checkout(request):
    """Using JWT authentication instead of Token authentication"""
    
    # User is already authenticated by decorators
    user = request.user
    
    # Parse data
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    # Create order
    serializer = OrderCreateSerializer(data=data)
    if serializer.is_valid():
        order = serializer.save(vendor=str(VENDOR_PUBKEY), user=user)
        
        # Create on-chain order (convert async function to sync)
        try:
            order_id = order.order_id
            price = int(float(order.total_price) * 10**6)  # USDC decimals=6
            
            # Call async Solana functions synchronously
            program = async_to_sync(get_program)()
            
            order_pda = Pubkey.find_program_address(
                [b"order", order_id.to_bytes(8, 'le')],
                PROGRAM_ID
            )[0]
            
            async_to_sync(program.rpc["add_order"])(
                order_id, 
                price, 
                ctx={"accounts": {
                    "order": order_pda,
                    "vendor": VENDOR_KEYPAIR.public_key,
                    "system_program": SYS_PROGRAM_ID,
                }}
            )
            
            return JsonResponse({
                'orderId': str(order_id),
                'price': price,
                'vendor': str(VENDOR_PUBKEY),
                'mint': str(MINT),
            })
        except Exception as e:
            return JsonResponse({'error': f'Blockchain error: {str(e)}'}, status=500)
    
    return JsonResponse(serializer.errors, status=400)

@csrf_exempt
async def save_transaction(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        order = await sync_to_async(Order.objects.get)(order_id=data['orderId'])
        order.tx_hash = data['txSignature']
        order.status = 'completed'
        await sync_to_async(order.save)()
        return JsonResponse({'status': 'saved'})
    return JsonResponse({'error': 'Invalid method'}, status=400)

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
    # permission_classes = [IsAuthenticated]
    permission_classes = [IsAdminUser]

    # def get_serializer_class(self):
    #     if self.request.method == "POST":
    #         return OrderCreateSerializer
    #     return OrderSerializer

class OrderCreateApiView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]


class UserOrderListApiView(generics.ListAPIView):
    queryset = Order.objects.prefetch_related('items__product')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    # permission_classes = [IsAuthenticated]

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
        wallet = request.data.get("wallet_address")
        signature = request.data.get("signature")
        nonce = request.data.get("nonce")

        if not isinstance(wallet, str) or not isinstance(signature, str):
            return Response(
                {
                    "error": "wallet and signature must be base58 strings"
                },
                status=400
            )

        try:
            # Decode base58 into bytes
            wallet_bytes = base58.b58decode(wallet)
            signature_bytes = base58.b58decode(signature)
            pubkey = Pubkey.from_bytes(wallet_bytes)  # just for consistency/storage
        except Exception:
            return Response(
                {
                    "error": "invalid wallet or signature format"
                },
                status=400
            )

        
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

        if user.nonce_issued_at and datetime.now(timezone.utc) - user.nonce_issued_at > timedelta(minutes=5):
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
            verify_key = VerifyKey(wallet_bytes)
            verify_key.verify(message.encode("utf-8"), signature_bytes)
        except BadSignatureError:
            return Response(
                {
                    "error": "signature invalid"
                },
                status=400
            )

            sig = Signature.from_string(signature)
            pubkey = Pubkey(based58.b58decode(wallet))  

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

        # Success
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
    

   