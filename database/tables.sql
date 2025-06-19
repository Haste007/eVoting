-- Delete existing tables if they exist (child tables first)
DROP TABLE IF EXISTS
    election_results,
    votes,
    candidates,
    election_constituencies,
    constituency_districts,
    party_members,
    parties,
    citizens,
    constituencies,
    elections,
    districts;

-- Districts Table
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Citizens Table
CREATE TABLE citizens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nid VARCHAR(20) UNIQUE NOT NULL,
    district_id INT REFERENCES districts(id) ON DELETE SET NULL, -- Reference districts table
    face TEXT
);

-- Parties Table
CREATE TABLE parties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    president INT NOT NULL REFERENCES citizens(id) ON DELETE CASCADE
);

-- Party Members Table (Many-to-Many Relationship)
CREATE TABLE party_members (
    party_id INT REFERENCES parties(id) ON DELETE CASCADE,
    citizen_id INT REFERENCES citizens(id) ON DELETE CASCADE,
    PRIMARY KEY (party_id, citizen_id)
);

-- Constituencies Table
CREATE TABLE constituencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Constituency Districts Table (Many-to-Many Relationship)
CREATE TABLE constituency_districts (
    constituency_id INT REFERENCES constituencies(id) ON DELETE CASCADE,
    district_id INT REFERENCES districts(id) ON DELETE CASCADE,
    PRIMARY KEY (constituency_id, district_id)
);

-- Elections Table
CREATE TABLE elections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    started BOOLEAN NOT NULL DEFAULT FALSE,
    ended BOOLEAN NOT NULL DEFAULT FALSE
);
-- Election Constituencies Table (Many-to-Many Relationship)
CREATE TABLE election_constituencies (
    election_id INT REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id INT REFERENCES constituencies(id) ON DELETE CASCADE,
    PRIMARY KEY (election_id, constituency_id)
);

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    party_id INT REFERENCES parties(id) ON DELETE CASCADE, -- Reference the party
    citizen_id INT REFERENCES citizens(id) ON DELETE CASCADE, -- Reference the citizen (party member)
    constituency_id INT REFERENCES constituencies(id) ON DELETE CASCADE, -- Reference the constituency
    UNIQUE (party_id, constituency_id) -- Ensure one candidate per party per constituency
);

-- Votes Table
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    election_id INT REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id INT REFERENCES constituencies(id) ON DELETE CASCADE,
    party_id INT REFERENCES parties(id) ON DELETE CASCADE,
    voter_hash VARCHAR(255) NOT NULL,
    vote_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Election Results Table
CREATE TABLE election_results (
    id SERIAL PRIMARY KEY,
    election_id INT REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id INT REFERENCES constituencies(id) ON DELETE CASCADE,
    party_id INT REFERENCES parties(id) ON DELETE CASCADE,
    total_votes INT NOT NULL DEFAULT 0
);