import pandas as pd
import random
import numpy as np


random.seed(42)
np.random.seed(42)

# Parameters
num_users = 50
num_items = 20

# Example food items (mix of categories)
food_items = [
    "Jollof Rice", "Fried Rice", "Egusi Soup", "Efo Riro", "Suya",
    "Shawarma", "Burger", "Pizza", "Pasta", "Sandwich",
    "Fufu", "Amala", "Pounded Yam", "Beans", "Plantain",
    "Chicken Wings", "Fish Stew", "Goat Meat", "Salad", "Ice Cream"
]

# Generate synthetic implicit feedback data (1 = ordered, 0 = not ordered)
data = []
for user_id in range(1, num_users + 1):
    # Each user will order between 3 and 10 items
    num_orders = random.randint(3, 10)
    ordered_items = random.sample(food_items, num_orders)
    for item in ordered_items:
        frequency = random.randint(1, 5)
        data.append([user_id, item, frequency])

# Convert to DataFrame
df = pd.DataFrame(data, columns=["user_id", "item", "frequency"])
df1 = df.to_csv("synthetic_food_orders.csv", index=False)


