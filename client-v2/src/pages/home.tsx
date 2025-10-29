import { Logo } from "@/components/logo";
import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export const HomePage = () => {
  return (
    <PageContainer {...PAGE_METADATA.home}>
      <div className="mb-8 transform transition-all duration-1000 delay-300 flex w-full justify-center">
        <Logo height={400} width={400} />
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 transform transition-all duration-1000 delay-500">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          commbank.eth
        </span>
      </h1>{" "}
    </PageContainer>
  );
};
