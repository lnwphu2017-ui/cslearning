# ใช้ Node.js 20-alpine เป็น Base Image
FROM node:20-alpine

# ตั้งค่า Working Directory ใน Container
WORKDIR /app

# คัดลอกไฟล์ package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกโค้ดทั้งหมดเข้าไปใน Container
COPY . .

# เปิด Port 3000
EXPOSE 3000

# รัน Frontend ในโหมด Development (ตามคำสั่ง npm run dev)
CMD ["npm", "run", "dev"]
