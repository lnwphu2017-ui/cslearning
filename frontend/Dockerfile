# ใช้ Node.js 20-alpine เป็น Base Image
FROM node:20-alpine

# ตั้งค่า Working Directory ใน Container
WORKDIR /app

# คัดลอกไฟล์ package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm ci

# คัดลอกโค้ดทั้งหมดเข้าไปใน Container
COPY . .

# Build Next.js สำหรับ Production
RUN npm run build

# เปิด Port 3000
EXPOSE 3000

# รัน Frontend ในโหมด Production
CMD ["npm", "start"]
