from django.contrib import admin
from django.urls import path, include
#from core.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('silk/', include('silk.urls', namespace='silk')),
#    path('api/user/register/', CreateUserView.as_view(), name="register"),
    path('api/token/', TokenObtainPairView.as_view(), name="token_obtain"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name="token_refresh"),
#    path('api/auth/', include('rest_framework.urls')),
]
