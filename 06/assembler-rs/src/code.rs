use crate::parse::{LabeledLine, HackInstruction, AInstruction, CInstruction};
use crate::symbol::SymbolTable;

pub fn generate(lines: Vec<LabeledLine>) -> Vec<String> {
    let symbol_table = SymbolTable::get_instance();
    for (line_number, line) in lines.iter().enumerate() {
        for label in &line.labels {
            symbol_table.add_entry(&label.name, line_number as u16);
        }
    }

    lines.iter().map(|line| {
        generate_instruction(
            if let HackInstruction::AInstruction(ref instruction) = line.instruction {
                if let Err(_) = instruction.value.parse::<u16>() {
                    // symbol alert, replace it
                    let value = symbol_table.get_else_set(&instruction.value);
                    HackInstruction::AInstruction(AInstruction { value: format!("{}", value) }) // coerce it back to a string, ugh
                } else {
                    HackInstruction::AInstruction(instruction.clone())
                }
            } else {
                line.instruction.clone()
            }
        )
    }).collect()
}

fn generate_instruction(instruction: HackInstruction) -> String {
    match instruction {
        HackInstruction::AInstruction(i) => a_instruction(i),
        HackInstruction::CInstruction(i) => c_instruction(i),
    }
}
fn a_instruction(instruction: AInstruction) -> String {
    format!("0{:015b}", instruction.value.parse::<u16>().unwrap())
}

fn c_instruction(instruction: CInstruction) -> String {
    let c_bits = comp(instruction.comp).unwrap();
    let d_bits = dest(instruction.dest).unwrap();
    let j_bits = jump(instruction.jump).unwrap();

    let mut result = vec![1, 1, 1]; // C-instruction prefix (3)
    result.extend(c_bits.iter());   // comp bits (7)
    result.extend(d_bits.iter());   // dest bits (3)
    result.extend(j_bits.iter());   // jump bits (3)

    result.iter().map(|b| format!("{}", b)).collect()
}

fn dest(mnemonic: Option<String>) -> Result<[u8; 3], &'static str> {
    let mut result = [0, 0, 0];

    if let Some(m) = mnemonic {
        let split = m.split("").collect::<Vec<&str>>();
        for destination in split {
            match destination {
                "" => continue,
                "A" => result[0] = 1,
                "D" => result[1] = 1,
                "M" => result[2] = 1,
                _ => return Err("invalid dest mnemonic"), // todo handle invalid destinations like "MM". also should this be in the parser?
            }
        }
    };
    Ok(result)
}

fn jump(mnemonic: Option<String>) -> Result<[u8; 3], &'static str> {
    if let Some(m) = mnemonic {
        match m.as_ref() {
            "JGT" => Ok([0, 0, 1]),
            "JEQ" => Ok([0, 1, 0]),
            "JGE" => Ok([0, 1, 1]),
            "JLT" => Ok([1, 0, 0]),
            "JNE" => Ok([1, 0, 1]),
            "JLE" => Ok([1, 1, 0]),
            "JMP" => Ok([1, 1, 1]),
            _     => Err("invalid jump mnemonic"),
        }
    } else { Ok([0, 0, 0]) }
}

fn comp(mnemonic: String) -> Result<[u8; 7], &'static str> {
    match mnemonic.as_ref() {
        // this is absolute garbage, need to find some sort of pattern to set these bits
        // need to sort of reverse-engineer the ALU? and also figure out an efficient way to parse
        // these... not sure if it's worthwhile
        // could at least collapse the c-bit (the one that selects A vs M), but seems i'd need an
        // external regex crate for that? blargh
        "0"   => Ok([0, 1, 0, 1, 0, 1, 0]),
        "1"   => Ok([0, 1, 1, 1, 1, 1, 1]),
        "-1"  => Ok([0, 1, 1, 1, 0, 1, 0]),
        "D"   => Ok([0, 0, 0, 1, 1, 0, 0]),
        "A"   => Ok([0, 1, 1, 0, 0, 0, 0]),
        "M"   => Ok([1, 1, 1, 0, 0, 0, 0]),
        "!D"  => Ok([0, 0, 0, 1, 1, 0, 1]),
        "!A"  => Ok([0, 1, 1, 0, 0, 0, 1]),
        "!M"  => Ok([1, 1, 1, 0, 0, 0, 1]),
        "-D"  => Ok([0, 0, 0, 1, 1, 1, 1]),
        "-A"  => Ok([0, 1, 1, 0, 0, 1, 1]),
        "-M"  => Ok([1, 1, 1, 0, 0, 1, 1]),
        "D+1" => Ok([0, 0, 1, 1, 1, 1, 1]),
        "A+1" => Ok([0, 1, 1, 0, 1, 1, 1]),
        "M+1" => Ok([1, 1, 1, 0, 1, 1, 1]),
        "D-1" => Ok([0, 0, 0, 1, 1, 1, 0]),
        "A-1" => Ok([0, 1, 1, 0, 0, 1, 0]),
        "M-1" => Ok([1, 1, 1, 0, 0, 1, 0]),
        "D+A" => Ok([0, 0, 0, 0, 0, 1, 0]),
        "D+M" => Ok([1, 0, 0, 0, 0, 1, 0]),
        "D-A" => Ok([0, 0, 1, 0, 0, 1, 1]),
        "D-M" => Ok([1, 0, 1, 0, 0, 1, 1]),
        "A-D" => Ok([0, 0, 0, 0, 1, 1, 1]),
        "M-D" => Ok([1, 0, 0, 0, 1, 1, 1]),
        "D&A" => Ok([0, 0, 0, 0, 0, 0, 0]),
        "D&M" => Ok([1, 0, 0, 0, 0, 0, 0]),
        "D|A" => Ok([0, 0, 1, 0, 1, 0, 1]),
        "D|M" => Ok([1, 0, 1, 0, 1, 0, 1]),
        _     => Err("invalid comp mnemonic"),
    }
}