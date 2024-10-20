import pandas as pd
import numpy as np 
import random as rnd
from typing import *
from linear_model import *
import metrics

path = '/home/uvusibuneka/Desktop/СИИ/Module 2/lab3/california_housing_train.csv' 
df = pd.read_csv(path)

df.describe()

df = (df - df.min())/(df.max() - df.min())
df = df.dropna()

df = df.reset_index(drop=True)
df["ones"] = np.ones(len(df))


model = linear_model(df, metrics.MSE())
model.split_df("median_house_value")
model.fit(300, lr=0.00001)
print(model.coef_determination())
print(model.weights)
'''
model_MAE = linear_model(df, metrics.MAE())
model_MAE.split_df("median_house_value")
model_MAE.fit(300, lr=0.00001)
print(f"{model_MAE.coef_determination():.3f}")
print([f"{weight:.3f}" for weight in model_MAE.weights])


df["population_density"] = df['population'] / df['households']

model2 = linear_model(df, metrics.MSE())
model2.split_df("median_house_value")
model2.fit(300, lr=0.00001)
print(model2.coef_determination())
print(model2.weights)


weights = np.array([rnd.uniform(-1, 1) for _ in range(len(df.T) - 1)])
model_reg_MAE = linear_model(df, weights=weights, metric=metrics.reg_MAE(0.5, weights))
model_reg_MAE.split_df("median_house_value")
model_reg_MAE.fit(10000, lr=0.000001)
print([f"{weight:.3f}" for weight in model_reg_MAE.weights])


weights = np.array([rnd.uniform(-1, 1) for _ in range(len(df.T) - 1)])
model_reg_MSE = linear_model(df, weights=weights, metric=metrics.reg_MSE(0.5, weights))
model_reg_MSE.split_df("median_house_value")
model_reg_MSE.fit(10000, lr=0.000001)
print(f"{model_reg_MSE.coef_determination():.3f}")
print([f"{weight:.3f}" for weight in model_reg_MSE.weights])


weights = np.array([rnd.uniform(-1, 1) for _ in range(len(df.T) - 1)])
model_reg_MSE = linear_model(df, weights=weights, metric=metrics.reg_MSE(0.5, weights))
model_reg_MSE.split_df("median_house_value")
model_reg_MSE.fit(10000, lr=0.000001)
print(f"{model_reg_MSE.coef_determination():.3f}")
print([f"{weight:.3f}" for weight in model_reg_MSE.weights])


df = df.drop("median_income", axis=1)
weights = np.array([rnd.uniform(-1, 1) for _ in range(len(df.T) - 1)])
model_reg_MSE = linear_model(df, weights=weights, metric=metrics.reg_MSE(0.5, weights))
model_reg_MSE.split_df("median_house_value")
model_reg_MSE.fit(10000, lr=0.000001)
print(f"{model_reg_MSE.coef_determination():.3f}")
print([f"{weight:.3f}" for weight in model_reg_MSE.weights])
'''
weights = np.array([rnd.uniform(-1, 1) for _ in range(len(df.T) - 1)])
model_reg_MSE = linear_model(df, weights=weights, metric=metrics.reg_MSE_L1(0.5, weights))
model_reg_MSE.split_df("median_house_value")
model_reg_MSE.shuffle_df()
model_reg_MSE.fit(500, lr=0.00001)
print(f"{model_reg_MSE.coef_determination():.3f}")
print([f"{weight:.3f}" for weight in model_reg_MSE.weights])

df = df.drop("total_bedrooms", axis=1)
df = df.drop("population", axis=1)

model = linear_model(df, metrics.MSE())
model.split_df("median_house_value")
model.fit(300, lr=0.00001)
print(model.coef_determination())
print(model.weights)
