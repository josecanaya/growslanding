import { notFound } from "next/navigation";
import { getRequestConfig, requestLocale } from "next-intl/server";

// Can be imported from a shared config
const locales = ["en", "es"];

export default getRequestConfig(async () => {
  const locale = await requestLocale();
  if (!locales.includes(locale as any)) notFound();
  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
