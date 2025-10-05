import hre from "hardhat";

export async function main() {
  console.log("HRE keys:", Object.keys(hre));
}

main().catch((e)=>{console.error(e);process.exitCode=1;});
