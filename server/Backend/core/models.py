from django.db import models
from django.contrib.auth.models import AbstractUser, AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils.translation import gettext_lazy
import uuid


class CustomUserManager(BaseUserManager):
#   def create_user(self, email, password, **extra_fields):
#        if not email:
#            raise ValueError("The Email field must be set")
#        email = self.normalize_email(email)
#        user = self.model(email=email, **extra_fields)
#        user.set_password(password)
#        user.save(using=self._db)
#        return user

    def create_user(self, email, wallet_address=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not wallet_address:
            raise ValueError("Wallet address is required")
    
        email = self.normalize_email(email)
        user = self.model(email=email, wallet_address=wallet_address, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must be a staff')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Must be a Superuser')
        return self.create_user(email, wallet_address='superuser', password=password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, null=False)
    name = models.CharField(max_length=253, blank=True, null=True)
    wallet_address = models.CharField(max_length=255, unique=True, blank=True, null=True)
    login_nonce = models.CharField(max_length=255, blank=True, null=True)
    nonce_issued_at =  models.DateTimeField(blank=True, null=True)

    is_staff = models.BooleanField(
        gettext_lazy('Staff Status'), default=False,
        help_text= gettext_lazy('Designates whether the user can log in the site')
    )
    is_active = models.BooleanField(
        gettext_lazy('Active Status'), default=True,
        help_text= gettext_lazy('Designates whether this user should be treated as active')
    )
    

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    def __str__(self):
        return self.email

    

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    image = models.ImageField(upload_to="Products", blank=True, null=True)

    @property
    def in_stock(self):
        return self.stock > 0

    def __str__(self):
        return self.name

class Order(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = 'Pending'
        CONFIRMED = 'Confirmed'
        CANCELLED = 'Cancelled'

    order_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING
    )

    products = models.ManyToManyField(Product, through="OrderItem", related_name="orders")

    def __str__(self):
        return f"Order {self.order_id} by {self.user.email}"

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name= "items"
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    @property
    def item_subtotal(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order {self.order.order_id}"