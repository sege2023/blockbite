# preprocessing_pipeline.py
import os
import pandas as pd
from sqlalchemy import create_engine

def fetch_order_data():
    DATABASE_URL = os.getenv('DATABASE_URL')  
    engine = create_engine(DATABASE_URL)
    
    query = """
    SELECT 
        o.user_id,
        oi.product_name as food,
        oi.quantity as frequency,
        o.created_at
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.status = 'completed'
    AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
    """
    
    df = pd.read_sql(query, engine)
    return df

def clean_production_data():
    df = fetch_order_data()
    
    df = df.dropna() 
    df = df[df['frequency'] > 0]  
    
    cleaned_df = df.groupby(['user_id', 'food'])['frequency'].sum().reset_index()
    
    return cleaned_df