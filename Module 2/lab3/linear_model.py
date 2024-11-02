import pandas as pd
import numpy as np 
import random as rnd
from typing import *
from error import *
from common import base_model

class linear_model(base_model.BaseModel):
    def __init__(self, df: pd.DataFrame, error: Error, weights = np.array([])):
        num_features = len(df.T) - 1
        if len(weights) == 0:
            self.weights = np.array([rnd.uniform(-1, 1) for _ in range(num_features)])
        else:
            self.weights = weights
        self.df = df
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.error = error

    def predict(self, x: pd.DataFrame) -> pd.Series:
        return x.dot(self.weights)

    def shuffle_df(self):
        self.df = self.df.sample(frac=1).reset_index(drop=True)
    
    def split_df(self, target: str):
        train_size = int(0.8 * len(self.df))
        train_df = self.df[:train_size]
        test_df = self.df[train_size:]
        self.X_train = train_df.drop(target, axis=1)
        self.y_train = train_df[target]
        self.X_test = test_df.drop(target, axis=1)
        self.y_test = test_df[target]

    def fit(self, epochs: int, lr=0.0001) -> bool:
        if any(x is None for x in [self.X_train, self.y_train]):
            raise ValueError("Some of the training or testing data is missing.")

        for _ in range(epochs):
            f = np.array(self.X_train).dot(self.weights)
            grad = self.error.gradient(X=self.X_train, y_pred=self.y_train, y=f)
            self.weights -= lr * grad
            
        return True
    

    def coef_determination(self):
        numerator = sum([(y - pred_y)**2 for y, pred_y in zip(self.y_test, self.predict(self.X_test))])
        denominator = sum([(y - np.mean(self.y_test))**2 for y in  self.y_test])
        return 1 - numerator/denominator


class stohastic_linear_model(linear_model):
    def __init__(self, df: pd.DataFrame, metric: Error, weights = np.array([])):
        super().__init__(df, metric, weights)

    def st_fit(self, epochs: int, lr=0.0001, batch_size=100) -> bool:
        if any(x is None for x in [self.X_train, self.y_train, self.X_test, self.y_test]):
            raise ValueError("Some of the training or testing data is missing.")

        for _ in range(epochs):
            for i in range(len(self.X_train), batch_size):
                X = self.X_train.iloc[i:i+batch_size]
                y = self.y_train.iloc[i:i+batch_size]
                f = np.array(X).dot(self.weights)
                grad = self.metric.gradient(X, f, y)
                self.weights -= lr * grad
            
        return True
    

