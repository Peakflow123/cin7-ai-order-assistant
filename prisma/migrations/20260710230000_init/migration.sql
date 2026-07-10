CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'NEEDS_REVIEW', 'READY', 'CREATED', 'ERROR');
CREATE TYPE "LineStatus" AS ENUM ('MATCHED', 'NEEDS_REVIEW', 'UNMATCHED');

CREATE TABLE "Company" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cin7Connection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "apiKeyEncrypted" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL DEFAULT 'https://inventory.dearsystems.com/ExternalApi/v2',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cin7Connection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutlookConnection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "email" TEXT,
  "accessTokenEncrypted" TEXT NOT NULL,
  "refreshTokenEncrypted" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutlookConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GmailConnection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "email" TEXT,
  "accessTokenEncrypted" TEXT NOT NULL,
  "refreshTokenEncrypted" TEXT NOT NULL,
  "expiryDate" BIGINT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GmailConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "cin7Id" TEXT,
  "sku" TEXT,
  "name" TEXT NOT NULL,
  "barcode" TEXT,
  "uom" TEXT,
  "status" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "cin7Id" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductAlias" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "customerId" TEXT,
  "rawText" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAlias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceMessageId" TEXT,
  "sender" TEXT,
  "subject" TEXT,
  "originalText" TEXT NOT NULL,
  "customerText" TEXT,
  "customerId" TEXT,
  "poNumber" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
  "cin7SaleId" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderLine" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "rawProductText" TEXT NOT NULL,
  "productId" TEXT,
  "productName" TEXT,
  "sku" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "uom" TEXT,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "LineStatus" NOT NULL DEFAULT 'UNMATCHED',
  CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Cin7Connection_companyId_key" ON "Cin7Connection"("companyId");
CREATE UNIQUE INDEX "OutlookConnection_companyId_key" ON "OutlookConnection"("companyId");
CREATE UNIQUE INDEX "GmailConnection_companyId_key" ON "GmailConnection"("companyId");
CREATE UNIQUE INDEX "Product_companyId_cin7Id_key" ON "Product"("companyId", "cin7Id");
CREATE INDEX "Product_companyId_sku_idx" ON "Product"("companyId", "sku");
CREATE INDEX "Product_companyId_name_idx" ON "Product"("companyId", "name");
CREATE UNIQUE INDEX "Customer_companyId_cin7Id_key" ON "Customer"("companyId", "cin7Id");
CREATE INDEX "Customer_companyId_name_idx" ON "Customer"("companyId", "name");
CREATE UNIQUE INDEX "ProductAlias_companyId_customerId_rawText_key" ON "ProductAlias"("companyId", "customerId", "rawText");

ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cin7Connection" ADD CONSTRAINT "Cin7Connection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OutlookConnection" ADD CONSTRAINT "OutlookConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductAlias" ADD CONSTRAINT "ProductAlias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
