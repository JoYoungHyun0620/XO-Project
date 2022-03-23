# -*- coding: utf-8 -*-
import io
import os

from google.cloud import vision_v1
from google.cloud.vision_v1 import types

os.environ["GOOGLE_APPLICATION_CREDENTIALS"]="python\ocr-project-344301-d75a5584d892.json"
#사용할 클라이언트 설정
client = vision_v1.ImageAnnotatorClient()
#receipt_img 아래에 있는 이미지 파일 불러와서 txt로 변환하기
path = os.path.join('public/images/test1.png')
with io.open(path,'rb') as image_file :
    content = image_file.read()
image = types.Image(content = content)
response = client.text_detection(image=image)
texts = response.text_annotations
realtexts = texts[0].description

print(realtexts)