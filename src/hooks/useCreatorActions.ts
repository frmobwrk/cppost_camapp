import { PostImage, ProcessedImage } from "../types";


export function useCreatorActions() {

    async function uploadPost(processedImages: ProcessedImage[], details: string) {
        const imageList = [...processedImages];

        const tasks: Promise<PostImage>[] = imageList.map(async (img) => {
            // Here, upload Images to cloud storage such as S3
            // for now, use local path instead of downloadUri
            const file: PostImage = {
                uri: img.uri,
                width: img.width,
                height: img.height,
                extension: img.extension,
                fullSize: img.fullSize,
                type: img.type,
            };

            return file;
        });

        await Promise.all(tasks).then((images) => {
            // Here, call the API to create a post
            const post = createPostObject(images, details);
            console.log('api body => ', post)
        });
    }

    function createPostObject(images: PostImage[], details: string): any {
        // Here, include other info such as user id
        const post = {
            source: images,
            details: details
        }
        return post;
    }


    return { uploadPost };
}