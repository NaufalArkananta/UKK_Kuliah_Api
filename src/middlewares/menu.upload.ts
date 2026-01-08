import multer from "multer";
import { Request } from "express";
import { ROOT_DIRECTORY } from "../config";

/** define storage to save uploaded file */
const storage = multer.diskStorage({
    destination: (
        req: Request,
        file: Express.Multer.File,
        callback:(error: Error | null , destination: string) => void
    ) => {
        const storagePath = `${ROOT_DIRECTORY}/public/menuImage/`
        callback(null, storagePath)
    },
    filename: (
        req: Request,
        file: Express.Multer.File,
        callback:(error: Error | null , destination: string) => void
    ) => {
        const fileName = `${Math.random()}-${file.originalname}`
        callback(null, fileName)
    }
})

// define funtion to filtering file
const filterFile = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    // ddefine allowed extension
    const allowedFile = /png|jpg|jpeg/
    // check file extension of uploud
    const isAllow = allowedFile.test(file.mimetype)

    if(isAllow){
        callback(null, true)
        return
    }else {
        callback(new Error(`your file is not allow to uploud`))
        return
    }
}

const uploadMenuImage = multer({
    storage, 
    fileFilter: filterFile,
    limits: {fileSize: 5 * 1024 * 1024}
})

export{uploadMenuImage}