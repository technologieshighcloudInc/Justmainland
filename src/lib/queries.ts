import { queryOptions } from "@tanstack/react-query";

import {
  getPublicProperty,
  getSiteMedia,
  getSiteSettings,
  listPublicProperties,
  listTestimonials,
} from "./public.functions";

export const siteMediaQuery = queryOptions({
  queryKey: ["site-media"],
  queryFn: () => getSiteMedia(),
  staleTime: 5 * 60 * 1000,
});

export const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: () => listTestimonials(),
  staleTime: 5 * 60 * 1000,
});

export const siteSettingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: () => getSiteSettings(),
  staleTime: 5 * 60 * 1000,
});

export type PropertyFilters = {
  kind?: string;
  type?: string;
  city?: string;
  search?: string;
  featuredOnly?: boolean;
  limit?: number;
};

export const propertiesQuery = (filters: PropertyFilters = {}) =>
  queryOptions({
    queryKey: ["properties", filters],
    queryFn: () => listPublicProperties({ data: filters }),
    staleTime: 60 * 1000,
  });

export const propertyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["property", slug],
    queryFn: () => getPublicProperty({ data: { slug } }),
    staleTime: 60 * 1000,
  });
