import sys

# 이미지 데이터 받기
image_data = sys.stdin.buffer.read()

# 이미지 데이터를 파일로 저장
with open("received_image.jpg", "wb") as f:
    f.write(image_data)

if (image_data):
    print("Success!")
else:
    print("Fail...")