mod code;
mod parse;
mod symbol;

use std::fs::File;
use std::io::{self, Write, BufRead, BufReader};


use code::generate;
use parse::{parse_lines};
fn main() {
    // if let Some(arg1) = args().nth(1) {
    //     println!("The first argument is {}", arg1);
    // }
    // let filename = args().nth(1).expect("No file name provided");
    let lines = file_to_vec("./Add.asm".to_string()).unwrap();

    let parsed = parse_lines(lines.as_slice());
    let generated = generate(parsed);
    let mut output = File::create("./Add.hack".to_string()).unwrap();
    for line in generated {
        println!("{}", line);
        write!(output, "{}\n", line).unwrap();
    }
}
fn file_to_vec(filename: String) -> io::Result<Vec<String>> {
    let file_in = File::open(filename)?;
    let file_reader = BufReader::new(file_in);
    Ok(file_reader.lines().filter_map(io::Result::ok).collect())
}
