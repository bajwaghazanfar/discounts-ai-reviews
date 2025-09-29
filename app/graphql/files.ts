export const UPLOAD_FILE = `
  mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          preview{
            image{
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }`;
