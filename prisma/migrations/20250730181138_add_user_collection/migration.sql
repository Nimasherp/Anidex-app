-- CreateTable
CREATE TABLE "UserCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxonId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "captureAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vernacular_names" (
    "taxonid" BIGINT NOT NULL,
    "vernacular_name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "country" TEXT,

    CONSTRAINT "vernacular_names_pkey" PRIMARY KEY ("taxonid")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCollection_userId_taxonId_key" ON "UserCollection"("userId", "taxonId");

-- AddForeignKey
ALTER TABLE "UserCollection" ADD CONSTRAINT "UserCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
