import type { Service } from '../types';

/**
 * Returns all available images for a service, preferring imageUrls over legacy imageUrl.
 * Falls back to an empty array if no images are available.
 */
export const getServiceImages = (service: Partial<Service> | null | undefined): string[] => {
  if (!service) return [];
  if (service.imageUrls && service.imageUrls.length > 0) {
    return service.imageUrls;
  }
  if (service.imageUrl) {
    return [service.imageUrl];
  }
  return [];
};

/**
 * Returns the primary (first) image for a service, preferring imageUrls[0] over legacy imageUrl.
 * Returns undefined if no image is available.
 */
export const getPrimaryServiceImage = (service: Partial<Service> | null | undefined): string | undefined => {
  const images = getServiceImages(service);
  return images[0] || undefined;
};
