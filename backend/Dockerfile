# ใช้ Python 3.11-slim เป็น Base Image
FROM python:3.11-slim

# ตั้งค่า Working Directory ใน Container
WORKDIR /app

# ติดตั้ง dependencies สำหรับการ build (เผื่อกรณีมี library ที่ต้องคอมไพล์)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# คัดลอกไฟล์ requirements.txt และติดตั้ง library
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดทั้งหมดเข้าไปใน Container
COPY . .

# เปิด Port 5000 (ตามที่ตั้งไว้ใน main.py)
EXPOSE 5000

# รัน Backend server
CMD ["python", "main.py"]
