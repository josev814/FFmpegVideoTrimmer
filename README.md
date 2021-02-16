#default django project setup
pyinstaller --name=mysite mysite/manage.py

# To run the server
python manage.py runserver

#Requires
Microsoft Visual C++ 14.0 (https://visualstudio.microsoft.com/visual-cpp-build-tools/)

Install other requirements using the requirements.txt file

```
python -m pip install -r requirements.txt
```
