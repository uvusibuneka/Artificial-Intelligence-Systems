import pandas as pd
import numpy as np 
import random as rnd
from typing import *

class LinearModel:
    def __init__(self, df: pd.DataFrame):
        num_features = len(df.T) - 1
        self.weights = [rnd.random() for _ in range(num_features)]
        self.df = df
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None

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


    @overload
    def fit(self, tolerance: float, lr=0.001) -> bool: ...

    @overload
    def fit(self, epochs: int, lr=0.001) -> bool: ...

    def fit(self, epochs: int, lr=0.0001) -> bool:
        if None in  [self.X_train, self.y_train, self.X_test, self.y_test]:
            return False
        
        for _ in range(epochs):
            f = self.X_train.dot(self.weights)
            err = f - self.y_train
            grad = 2 * self.X_train.T.dot(err)
            self.weights -= lr * grad
            
        return True


    def fit(self, tolerance: float, lr=0.001):
        '''
        if any(x is None for x in [self.X_train, self.y_train, self.X_test, self.y_test]):
            return False
        
        while self.MSE() > tolerance:
            f = self.X_train.dot(self.weights)
            err = f - self.y_train
            grad = 2 * self.X_train.T.dot(err)
            self.weights -= lr * grad
        '''
            
        return True

    def coef_determination(self):
        numerator = sum([(y - pred_y)**2 for y, pred_y in zip(self.y_train, self.predict(pd.concat([self.X_train, self.X_test], axis=0, ignore_index=True)))])
        denominator = sum([(y - np.mean(self.y_train))**2 for y in  self.y_train])
        return 1 - numerator/denominator