# # quick_test.py
# import requests

# # Test product creation via API
# files = {'image': open(r'C:\Users\user\desktop\projects\blockbite\server\Backend\download.jpeg', 'rb')}
# data = {
#     'name': 'Test Product',
#     'description': 'R2 Test',
#     'price': '19.99',
#     'stock': 5
# }

# response = requests.post('http://localhost:8000/api/products/', 
#                         files=files, data=data)
# print(response.json())

# debug_test.py
# authenticated_test.py
import requests

# Step 1: Login to get JWT token
login_data = {
    'email': '',  # The one you created with createsuperuser
    'password': ''
}

try:
    # Login to get token
    login_response = requests.post('http://localhost:8000/admin/', json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data['tokens']['access']
        print("Login successful!")
        
        # Step 2: Use token to create product
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        files = {'image': open(r'C:\Users\user\desktop\projects\blockbite\server\Backend\download.jpeg', 'rb')}
        data = {
            'name': 'Test Product',
            'description': 'R2 Test Product',
            'price': '19.99',
            'stock': 5
        }
        
        response = requests.post('http://localhost:8000/products/', 
                               files=files, data=data, headers=headers)
        
        print(f"Product Creation Status: {response.status_code}")
        
        if response.status_code == 201:
            print("SUCCESS! Product created:")
            print(response.json())
        else:
            print("ERROR creating product:")
            print(response.text)
    else:
        print("Login failed:")
        print(login_response.text)
        
except FileNotFoundError:
    print("Create a test_image.jpg file first")
except Exception as e:
    print(f"Error: {e}")