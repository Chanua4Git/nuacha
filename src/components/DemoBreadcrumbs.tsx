
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type DemoBreadcrumbsProps = {
  currentPage: 'demo' | 'options' | 'home';
};

const DemoBreadcrumbs = ({ currentPage }: DemoBreadcrumbsProps) => {
  return (
    <Breadcrumb className="max-w-6xl mx-auto px-4 py-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {(currentPage === 'demo' || currentPage === 'options') && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/demo">Try Demo</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        
        {currentPage === 'options' && (
          <BreadcrumbItem>
            <BreadcrumbPage>Solutions</BreadcrumbPage>
          </BreadcrumbItem>
        )}
        
        {currentPage === 'demo' && (
          <BreadcrumbItem>
            <BreadcrumbPage>Receipt Scanner</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default DemoBreadcrumbs;
