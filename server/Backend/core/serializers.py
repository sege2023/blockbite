from rest_framework import serializers
from .models import Product, Order, OrderItem, User
from django.contrib.auth import authenticate


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "password",
            "wallet_address",
            )

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    password = serializers.CharField(required=False)
    wallet_address = serializers.CharField(required=False)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        wallet = attrs.get("wallet_address")

        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
        elif wallet:
            try:
                user = User.objects.get(wallet_address=wallet)
            except User.DoesNotExist:
                raise serializers.ValidationError("No user with this wallet address.")
        else:
            raise serializers.ValidationError("Provide either (email+password) or wallet address.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        attrs["user"] = user
        return attrs


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'name',
            'description',
            'price',
            'stock',
        )

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Price must be greater than zero!"
                )
        return value
    

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name')
    product_price = serializers.DecimalField(
        source='product.price',
        max_digits=10,
        decimal_places=2,
        )
    class Meta:
        model = OrderItem
        fields = (
            'product_name',
            'product_price',
            'quantity',
            'item_subtotal',
        )

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self, obj):
        order_items = obj.items.all()
        return sum(order_item.item_subtotal for order_item in order_items)

    class Meta:
        model = Order
        fields = (
            'order_id',
            'created_at',
            'user',
            'status',
            'items',
            'total_price'
        )
