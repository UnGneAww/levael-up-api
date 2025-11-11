# --- Stage 1: "Builder" ---
# กล่องสำหรับ Build (ลง devDependencies ที่นี่)
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./

# 1. ติดตั้งทุกอย่าง (รวมถึง devDependencies)
RUN npm install

COPY . .

# 2. รัน build (ตอนนี้หา nest เจอแล้ว)
RUN npm run build

# --- Stage 2: "Production" ---
# กล่องสำหรับใช้งานจริง (เล็กและสะอาด)
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./

# 3. ติดตั้งเฉพาะ dependencies สำหรับรันจริง
RUN npm install --only=production

# 4. คัดลอกโฟลเดอร์ dist ที่ build เสร็จแล้วมาจาก Stage 1
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# 5. รันแอปจากไฟล์ที่ build แล้ว
CMD ["node", "dist/main"]