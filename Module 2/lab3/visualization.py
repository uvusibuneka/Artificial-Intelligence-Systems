import pandas as pd
import matplotlib.pyplot as plt

path = '/home/uvusibuneka/Desktop/СИИ/california_housing_train.csv' 
df = pd.read_csv(path)

df.plot()
plt.show()