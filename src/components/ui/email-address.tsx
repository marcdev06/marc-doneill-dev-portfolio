interface EmailAddressProps {
  address: string;
}

export function EmailAddress({ address }: EmailAddressProps) {
  const domainStart = address.lastIndexOf('@') + 1;

  // One span, so flex parents can't split the address
  return (
    <span>
      {address.slice(0, domainStart)}
      {/* Narrow screens wrap after the @, never mid-word */}
      <wbr />
      {address.slice(domainStart)}
    </span>
  );
}
