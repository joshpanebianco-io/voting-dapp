const UseCase = () => {
  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg mt-8">
      <h2 className="text-white text-3xl font-bold text-center mb-6">
        Why use blockchain technology for a voting application?
      </h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-purple-600 mb-4">
          Key Benefits of Blockchain in Voting
        </h3>
        <ul className="list-disc list-inside space-y-4 text-gray-700">
          <li>
            <strong className="text-purple-600">Decentralization:</strong> By
            distributing the voting data across a decentralized network, no
            single entity can control or manipulate the results.
          </li>
          <li>
            <strong className="text-purple-600">
              Transparency & Auditabilty:
            </strong>{" "}
            Blockchain provides a public ledger that can be audited by anyone in
            real-time, ensuring the transparency of the voting process.
          </li>
          <li>
            <strong className="text-purple-600">Security:</strong>{" "}
            Blockchain&apos;s cryptographic mechanisms make it highly resistant
            to tampering or hacking.
          </li>
          <li>
            <strong className="text-purple-600">Immutability:</strong> Once a
            vote is cast and added to the blockchain, it cannot be altered,
            ensuring the integrity of the voting record.
          </li>
          <li>
            <strong className="text-purple-600">Anonymity and Privacy:</strong>{" "}
            Blockchain can use advanced cryptographic techniques to ensure
            voters identities remain confidential while still verifying their
            eligibility.
          </li>
        </ul>
      </div>
      <h3 className="text-white text-2xl font-bold text-center mb-6">
        Real-Life Use Cases of Blockchain in Voting
      </h3>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-semibold text-purple-600">
            Sierra Leone Presidential Elections (2018)
          </h4>
          <p className="text-gray-700 mt-2">
            Sierra Leone used a blockchain-based platform to verify and count
            votes in real-time, demonstrating blockchain&apos;s ability to
            enhance electoral transparency.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-semibold text-purple-600">
            West Virginia, USA (2018 and 2020 Elections)
          </h4>
          <p className="text-gray-700 mt-2">
            West Virginia piloted blockchain voting for overseas military
            personnel using the Voatz app, enabling secure mobile voting.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-semibold text-purple-600">
            Utah County, USA (2020 Primary Elections)
          </h4>
          <p className="text-gray-700 mt-2">
            Utah County used the Voatz app for military and overseas voters,
            leveraging blockchain to secure voting data.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-semibold text-purple-600">
            Russian Federation Referendum (2020)
          </h4>
          <p className="text-gray-700 mt-2">
            Moscow implemented blockchain for parts of its constitutional
            amendment voting, allowing citizens to vote online securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UseCase;
