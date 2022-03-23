from PIL import Image

from PIL.ExifTags import TAGS

 

image = Image.open('./public/images/20200120_202504246.jpg')
info = image._getexif();
image.close()

 

# 새로운 딕셔너리 생성

taglabel = {}

 

for tag, value in info.items():
    decoded = TAGS.get(tag, tag)
    taglabel[decoded] = value


exifGPS = taglabel['GPSInfo']
latData = exifGPS[2]
lonData = exifGPS[4]


# 도, 분, 초 계산
latDeg = latData[0]
latMin = latData[1]
latSec = latData[2]

 

lonDeg = lonData[0]
lonMin = lonData[1]
lonSec = lonData[2]

 

# 도, 분, 초로 나타내기
Lat = str(int(latDeg)) + "°" + str(int(latMin)) + "'" + str(latSec) + "\"" + exifGPS[1]
Lon = str(int(lonDeg)) + "°" + str(int(lonMin)) + "'" + str(lonSec) + "\"" + exifGPS[3]

 

print(Lat, Lon)

 

# 도 decimal로 나타내기
# 위도 계산
Lat = (latDeg + (latMin + latSec / 60.0) / 60.0)
# 북위, 남위인지를 판단, 남위일 경우 -로 변경
if exifGPS[1] == 'S': Lat = Lat * -1

 

# 경도 계산
Lon = (lonDeg + (lonMin + lonSec / 60.0) / 60.0)
# 동경, 서경인지를 판단, 서경일 경우 -로 변경
if exifGPS[3] == 'W': Lon = Lon * -1

 

print(Lat, ",",  Lon)