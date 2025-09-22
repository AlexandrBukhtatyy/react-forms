export type FileUploader = {};
export type FileUploaderRequest = {};
export type FileUploaderResponse = {
  data: [];
};
export function makeFileUploader(
  callback: (params: FileUploaderRequest) => Promise<FileUploaderResponse>
): FileUploader {
  // TODO
  console.log(callback);
  return {
    data: [],
  };
}
