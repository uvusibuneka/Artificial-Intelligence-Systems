import pandas as pd
import numpy as np 
from typing import *
from linear_model import *
from error import *
from cross_validation import *

path = '/home/uvusibuneka/Desktop/СИИ/Module 2/lab3/california_housing_train.csv' 
df = pd.read_csv(path)
df = df.dropna()

print(df.describe())

target_name = 'median_house_value'
target = df[target_name]
df = df.drop(target_name, axis=1)
df = (df - df.min())/(df.max() - df.min())
df = pd.concat([df, target], axis=1)

df = df.reset_index(drop=True)
df["ones"] = np.ones(len(df))


model = linear_model(df, MSE())
model.split_df("median_house_value")
model.fit(500, lr=0.00001)
print(model.coef_determination())
print(model.weights)
'''
weights = np.array([rnd.uniform(-1, 1) for _ in range(len(df.T) - 1)])
model_reg_MSE = linear_model(df, weights=weights, metric=reg_MSE_L1(0.5, weights))
model_reg_MSE.split_df("median_house_value")
model_reg_MSE.shuffle_df()
model_reg_MSE.fit(500, lr=0.00001)
print(f"{model_reg_MSE.coef_determination():.3f}")
print([f"{weight:.3f}" for weight in model_reg_MSE.weights])

df = df.drop("total_bedrooms", axis=1)
df = df.drop("population", axis=1)

model = linear_model(df, MSE())
model.split_df("median_house_value")
model.fit(300, lr=0.00001)
print(model.coef_determination())
print(model.weights)
'''
cross_validation = cross_validation(df=df, target_name="median_house_value", error=MSE(), k=2)
cross_validation.split_df()
cross_validation.fit(500, lr=0.00001)
print(cross_validation.coef_determination())
print(cross_validation.best_model.weights)




