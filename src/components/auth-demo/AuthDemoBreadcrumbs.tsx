
import { Link, useLocation } from "react-router-dom";
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
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {(currentPage === "plans" || currentPage === "features" || currentPage === "landing") && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/auth-demo">Try Auth Demo</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {currentPage === "plans" && (
          <BreadcrumbItem>
            <BreadcrumbPage>Solutions</BreadcrumbPage>
          </BreadcrumbItem>
        )}
        {currentPage === "features" && (
          <BreadcrumbItem>
            <BreadcrumbPage>Features</BreadcrumbPage>
          </BreadcrumbItem>
        )}
        {currentPage === "landing" && (
          <BreadcrumbItem>
            <BreadcrumbPage>Auth Demo</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AuthDemoBreadcrumbs;
