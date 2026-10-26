import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EMPTY_LISTING, ListingForm } from "@/components/admin/listing-form";

export const Route = createFileRoute("/_authenticated/admin/listings/new")({
  component: NewListing,
});

function NewListing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Add listing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Save the details first, then add photos on the next screen.
      </p>
      <div className="mt-8">
        <ListingForm
          initial={EMPTY_LISTING}
          onSaved={async (id) => {
            await queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
            await navigate({ to: "/admin/listings/$id", params: { id } });
          }}
        />
      </div>
    </div>
  );
}
