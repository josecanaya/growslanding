import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Can be imported from a shared config
const locales = ["en", "es"];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();
  
  // Import messages based on locale
  let messages;
  if (locale === 'es') {
    messages = (await import('../messages/es.json')).default;
  } else {
    messages = (await import('../messages/en.json')).default;
  }
    
  return {
    messages,
  };
});
