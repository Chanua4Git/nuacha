
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type AuthDemoBreadcrumbsProps = {
  currentPage: "landing" | "plans" | "features";
};

const AuthDemoBreadcrumbs = ({ currentPage }: AuthDemoBreadcrumbsProps) => {
  return (
    <Breadcrumb className="max-w-6xl mx-auto px-4 py-4">
      <BreadcrumbList>
        {/* Auth Demo Landing: single breadcrumb */}
        {currentPage === "landing" && (
          <BreadcrumbItem>
            <BreadcrumbPage>Authentication Demo</BreadcrumbPage>
          </BreadcrumbItem>
        )}

        {/* Plans: Auth Demo (link) > Auth Solutions (current) */}
        {currentPage === "plans" && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/auth-demo">Authentication Demo</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Auth Solutions</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Features: Auth Demo (link) > Features (current) */}
        {currentPage === "features" && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/auth-demo">Authentication Demo</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Features</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AuthDemoBreadcrumbs;
