-- CreateTable
CREATE TABLE "CoursePart" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoursePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSection" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoursePart_programId_idx" ON "CoursePart"("programId");

-- CreateIndex
CREATE INDEX "CoursePart_order_idx" ON "CoursePart"("order");

-- CreateIndex
CREATE INDEX "CourseSection_partId_idx" ON "CourseSection"("partId");

-- CreateIndex
CREATE INDEX "CourseSection_order_idx" ON "CourseSection"("order");

-- AddForeignKey
ALTER TABLE "CoursePart" ADD CONSTRAINT "CoursePart_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_partId_fkey" FOREIGN KEY ("partId") REFERENCES "CoursePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
