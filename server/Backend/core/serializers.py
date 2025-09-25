from rest_framework import serializers
from .models import Product, Order, OrderItem, User
from django.contrib.auth import authenticate


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "wallet_address",
            )

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
#    email = serializers.EmailField(required=True)
    wallet_address = serializers.CharField(required=True)

    def validate(self, attrs):
 #       email = attrs.get("email")
        wallet = attrs.get("wallet_address").lower()

        try:
            user = User.objects.get(wallet_address__iexact=wallet)
        except User.DoesNotExist:
                raise serializers.ValidationError(
                    "invalid wallet address"
                    )
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        attrs["user"] = user
        return attrs


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'description',
            'price',
            'stock',
            'image',
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

class OrderItemCreateSerializer(serializers.ModelSerializer):
    product = serializers.SlugRelatedField(
        queryset=Product.objects.all(),
        slug_field="name"  
    )
    class Meta:
        model = OrderItem
        fields = (
            'product',
            'quantity'
        )

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self, obj):
        order_items = obj.items.all()
        return sum(order_item.item_subtotal for order_item in order_items)

    class Meta:
        model = Order
        fields = (
            'order_id',
            'created_at',
            'status',
            'items',
            'total_price'
        )
        read_only_fields = (
            'order_id',
            'created_at',
            'status'
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        order = Order.objects.create(user=user, **validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order
