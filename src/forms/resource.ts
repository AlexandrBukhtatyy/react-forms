export type Resource = {};
export type ResourceRequest = {};
export type ResourceResponse = {
  data: [];
};
export function makeResource(
  callback: (params: ResourceRequest) => Promise<ResourceResponse>
): Resource {
  // TODO
  console.log(callback);
  return {
    data: [],
  };
}
