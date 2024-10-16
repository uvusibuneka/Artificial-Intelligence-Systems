import pandas as pd
import numpy as np 
import random as rnd
from typing import *
from LinearModel import *

path = '/home/uvusibuneka/Desktop/СИИ/california_housing_train.csv' 
df = pd.read_csv(path)

df = (df - df.min())/(df.max() - df.min())
df = df.dropna()

df = df.reset_index(drop=True)
df["ones"] = np.ones(len(df))

model = LinearModel(df)
model.split_df("median_house_value")
model.fit(300, lr=0.00001)
print(model.coef_determination())
print(model.weights)
